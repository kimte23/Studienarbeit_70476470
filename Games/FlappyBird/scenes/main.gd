extends Node

@export var pipe_scene : PackedScene

var client := WebSocketPeer.new()
const SERVER_URL := "ws://localhost:5001"

var game_running := false
var game_over := false
const SCROLL_SPEED := 200
var score := 0
var screen_size: Vector2i
var ground_height: int
var pipes: Array
var can_fly := true
const PIPE_DELAY := 100
const PIPE_RANGE := 10

func _ready():
	client.connect_to_url(SERVER_URL)
	screen_size = get_viewport().size
	ground_height = $Ground.get_node("Sprite2D").texture.get_height()
	new_game()

func new_game():
	# Reset variables
	game_running = false
	game_over = false
	can_fly = true
	score = 0
	$ScoreLabel.text = "PUNKTE: " + str(score)
	get_tree().call_group("pipes", "queue_free")
	pipes.clear()
	# Generate starting pipes
	generate_pipes()
	$Bird.reset()
	
func _input(event):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			if game_over:
				new_game()
			if game_running == false:
				start_game()
				$GameOver.hide()
			else:
				if $Bird.flying:
					$Bird.flap()
					check_top()

func start_game():
	game_running = true
	$Bird.flying = true
	$Bird.flap()
	# Start pipe timer
	$PipeTimer.start()

func _process(delta):
	$Debug.text = ""
	
	client.poll()
	
	var state = client.get_ready_state()
	match state:
		
		WebSocketPeer.STATE_CONNECTING:
			$Debug.text = "Trying to connect..."
			
		WebSocketPeer.STATE_OPEN:
			$Debug.text = "Connected"
			
			while client.get_available_packet_count():
				# Check if server has sent ok-gesture
				var message = client.get_packet().get_string_from_utf8()
				if message == "ok":
					if game_over:
						new_game()
					if game_running == false:
						start_game()
						$GameOver.hide()
					else:
						if $Bird.flying and can_fly:
							$Bird.flap()
							can_fly = false
							check_top()
				# Enable flying again when there was an "ok-gesture-pause"
				else:
					can_fly = true
		
		WebSocketPeer.STATE_CLOSING:
			$Debug.text = "Closing connection..."
			# Keep polling to achieve proper close.
			pass
			
		WebSocketPeer.STATE_CLOSED:
			var code = client.get_close_code()
			var reason = client.get_close_reason()
			$Debug.text = "Connection closed with code: %d, reason %s. Reconnecting..." % [code, reason]
			client.connect_to_url(SERVER_URL)
	
	if game_running:
		for pipe in pipes:
			pipe.position.x -= SCROLL_SPEED * delta
			
		$Ground.position.x -= SCROLL_SPEED * delta
		# Reset ground
		if $Ground.position.x <= -screen_size.x:
			$Ground.position.x += screen_size.x



func _on_pipe_timer_timeout():
	generate_pipes()
	
	
func generate_pipes():
	var pipe = pipe_scene.instantiate()
	pipe.position.x = screen_size.x + PIPE_DELAY
	pipe.position.y = (screen_size.y - ground_height) * 0.5  + randi_range(-PIPE_RANGE, PIPE_RANGE)
	pipe.hit.connect(bird_hit)
	pipe.scored.connect(scored)
	add_child(pipe)
	pipes.append(pipe)
	
func scored():
	score += 1
	$ScoreLabel.text = "PUNKTE: " + str(score)

func check_top():
	if $Bird.position.y < 0:
		$Bird.falling = true
		stop_game()

func stop_game():
	$PipeTimer.stop()
	$GameOver.show()
	$Bird.flying = false
	game_running = false
	game_over = true
	
func bird_hit():
	$Bird.falling = true
	stop_game()

func _on_ground_hit():
	$Bird.falling = false
	stop_game()
